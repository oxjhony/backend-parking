import { Test, TestingModule } from '@nestjs/testing';
import { PicoPlacaService } from './pico-placa.service';
import { DiaSemana } from './enums/dia-semana.enum';

describe('PicoPlacaService', () => {
  let service: PicoPlacaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PicoPlacaService],
    }).compile();

    service = module.get<PicoPlacaService>(PicoPlacaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Validación de restricciones por día', () => {
    describe('Lunes - Dígitos 1 y 2', () => {
      it('debe restringir placa terminada en 1 el lunes dentro del horario', () => {
        // Lunes 18 Nov 2025, 14:00
        const fecha = new Date('2025-11-17T14:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'ABC121',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(1);
        expect(resultado.diaSemana).toBe('Lunes');
        expect(resultado.digitosRestringidos).toEqual([1, 2]);
      });

      it('debe restringir placa terminada en 2 el lunes dentro del horario', () => {
        const fecha = new Date('2025-11-17T10:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'XYZ452',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(2);
      });

      it('NO debe restringir placa terminada en 3 el lunes', () => {
        const fecha = new Date('2025-11-17T14:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'ABC123',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(false);
        expect(resultado.ultimoDigito).toBe(3);
      });
    });

    describe('Martes - Dígitos 3 y 4', () => {
      it('debe restringir placa terminada en 3 el martes dentro del horario', () => {
        const fecha = new Date('2025-11-18T14:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'ABC123',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(3);
        expect(resultado.diaSemana).toBe('Martes');
        expect(resultado.digitosRestringidos).toEqual([3, 4]);
      });

      it('debe restringir placa terminada en 4 el martes dentro del horario', () => {
        const fecha = new Date('2025-11-18T16:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'DEF564',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(4);
      });
    });

    describe('Miércoles - Dígitos 5 y 6', () => {
      it('debe restringir placa terminada en 5 el miércoles dentro del horario', () => {
        const fecha = new Date('2025-11-19T12:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'GHI785',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(5);
        expect(resultado.diaSemana).toBe('Miércoles');
        expect(resultado.digitosRestringidos).toEqual([5, 6]);
      });

      it('debe restringir placa terminada en 6 el miércoles dentro del horario', () => {
        const fecha = new Date('2025-11-19T08:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'JKL906',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(6);
      });
    });

    describe('Jueves - Dígitos 7 y 8', () => {
      it('debe restringir placa terminada en 7 el jueves dentro del horario', () => {
        const fecha = new Date('2025-11-20T15:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'MNO127',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(7);
        expect(resultado.diaSemana).toBe('Jueves');
        expect(resultado.digitosRestringidos).toEqual([7, 8]);
      });

      it('debe restringir placa terminada en 8 el jueves dentro del horario', () => {
        const fecha = new Date('2025-11-20T18:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'PQR348',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(8);
      });
    });

    describe('Viernes - Dígitos 9 y 0', () => {
      it('debe restringir placa terminada en 9 el viernes dentro del horario', () => {
        const fecha = new Date('2025-11-21T11:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'STU569',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(9);
        expect(resultado.diaSemana).toBe('Viernes');
        expect(resultado.digitosRestringidos).toEqual([9, 0]);
      });

      it('debe restringir placa terminada en 0 el viernes dentro del horario', () => {
        const fecha = new Date('2025-11-21T17:00:00');
        const resultado = service.validarPicoPlaca({
          placa: 'VWX780',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(true);
        expect(resultado.ultimoDigito).toBe(0);
      });
    });

    describe('Fin de semana - Sin restricciones', () => {
      it('NO debe restringir ninguna placa el sábado', () => {
        const fecha = new Date('2025-11-22T14:00:00'); // Sábado
        const resultado = service.validarPicoPlaca({
          placa: 'ABC123',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(false);
        expect(resultado.diaSemana).toBe('Sábado');
        expect(resultado.digitosRestringidos).toEqual([]);
      });

      it('NO debe restringir ninguna placa el domingo', () => {
        const fecha = new Date('2025-11-23T14:00:00'); // Domingo
        const resultado = service.validarPicoPlaca({
          placa: 'ABC123',
          fechaHora: fecha.toISOString(),
        });

        expect(resultado.tieneRestriccion).toBe(false);
        expect(resultado.diaSemana).toBe('Domingo');
        expect(resultado.digitosRestringidos).toEqual([]);
      });
    });
  });

  describe('Validación de horarios', () => {
    it('NO debe restringir antes de las 6:00 AM', () => {
      const fecha = new Date('2025-11-17T05:59:00'); // Lunes 5:59 AM
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121', // Dígito 1 (restringido los lunes)
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(false);
      expect(resultado.dentroHorario).toBe(false);
    });

    it('debe restringir a las 6:00 AM exactamente', () => {
      const fecha = new Date('2025-11-17T06:00:00'); // Lunes 6:00 AM
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(true);
      expect(resultado.dentroHorario).toBe(true);
    });

    it('debe restringir durante el horario (medio día)', () => {
      const fecha = new Date('2025-11-17T12:00:00'); // Lunes 12:00 PM
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(true);
      expect(resultado.dentroHorario).toBe(true);
    });

    it('debe restringir a las 7:59 PM (última hora)', () => {
      const fecha = new Date('2025-11-17T19:59:00'); // Lunes 7:59 PM
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(true);
      expect(resultado.dentroHorario).toBe(true);
    });

    it('NO debe restringir a las 8:00 PM (fuera del horario)', () => {
      const fecha = new Date('2025-11-17T20:00:00'); // Lunes 8:00 PM
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(false);
      expect(resultado.dentroHorario).toBe(false);
    });

    it('NO debe restringir después de las 8:00 PM', () => {
      const fecha = new Date('2025-11-17T21:00:00'); // Lunes 9:00 PM
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(false);
      expect(resultado.dentroHorario).toBe(false);
    });
  });

  describe('Casos especiales de placas', () => {
    it('debe manejar placas que terminan en letra (consideradas como 0)', () => {
      const fecha = new Date('2025-11-21T14:00:00'); // Viernes
      const resultado = service.validarPicoPlaca({
        placa: 'ABC12A',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(true);
      expect(resultado.ultimoDigito).toBe(0);
      expect(resultado.digitosRestringidos).toEqual([9, 0]);
    });

    it('debe manejar correctamente placa terminada en 0', () => {
      const fecha = new Date('2025-11-21T10:00:00'); // Viernes
      const resultado = service.validarPicoPlaca({
        placa: 'XYZ780',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.tieneRestriccion).toBe(true);
      expect(resultado.ultimoDigito).toBe(0);
    });

    it('debe convertir placa a mayúsculas en la respuesta', () => {
      const fecha = new Date('2025-11-17T14:00:00');
      const resultado = service.validarPicoPlaca({
        placa: 'abc121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.placa).toBe('ABC121');
    });
  });

  describe('Validación sin fecha (usar fecha actual)', () => {
    it('debe usar la fecha actual si no se proporciona fechaHora', () => {
      const resultado = service.validarPicoPlaca({
        placa: 'ABC123',
      });

      expect(resultado).toBeDefined();
      expect(resultado.fechaValidacion).toBeInstanceOf(Date);
      expect(resultado.placa).toBe('ABC123');
    });
  });

  describe('Método puedeIngresar', () => {
    it('debe retornar false si tiene restricción', () => {
      const fecha = new Date('2025-11-17T14:00:00'); // Lunes 2 PM
      const puedeIngresar = service.puedeIngresar('ABC121', fecha);

      expect(puedeIngresar).toBe(false);
    });

    it('debe retornar true si NO tiene restricción', () => {
      const fecha = new Date('2025-11-17T14:00:00'); // Lunes 2 PM
      const puedeIngresar = service.puedeIngresar('ABC123', fecha);

      expect(puedeIngresar).toBe(true);
    });

    it('debe retornar true fuera del horario', () => {
      const fecha = new Date('2025-11-17T21:00:00'); // Lunes 9 PM
      const puedeIngresar = service.puedeIngresar('ABC121', fecha);

      expect(puedeIngresar).toBe(true);
    });

    it('debe retornar true en fin de semana', () => {
      const fecha = new Date('2025-11-22T14:00:00'); // Sábado
      const puedeIngresar = service.puedeIngresar('ABC123', fecha);

      expect(puedeIngresar).toBe(true);
    });
  });

  describe('Mensajes descriptivos', () => {
    it('debe generar mensaje de restricción activa', () => {
      const fecha = new Date('2025-11-17T14:00:00');
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.mensaje).toContain('tiene restricción');
      expect(resultado.mensaje).toContain('ABC121');
      expect(resultado.mensaje).toContain('Lunes');
    });

    it('debe generar mensaje de sin restricción en fin de semana', () => {
      const fecha = new Date('2025-11-22T14:00:00');
      const resultado = service.validarPicoPlaca({
        placa: 'ABC123',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.mensaje).toContain('NO tiene restricción');
      expect(resultado.mensaje).toContain('Sábado');
    });

    it('debe generar mensaje de fuera de horario', () => {
      const fecha = new Date('2025-11-17T21:00:00');
      const resultado = service.validarPicoPlaca({
        placa: 'ABC121',
        fechaHora: fecha.toISOString(),
      });

      expect(resultado.mensaje).toContain('NO tiene restricción');
      expect(resultado.mensaje).toContain('horario');
    });
  });
});
